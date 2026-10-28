package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.*;
import com.stocksmart.model.*;
import com.stocksmart.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final WebSocketNotificationService webSocketService;

    // ==========================================
    // SALES ORDERS
    // ==========================================

    public List<SalesOrderDto> getSalesOrders(OrderStatus status, String search) {
        List<SalesOrder> orders = salesOrderRepository.searchOrders(status, search);
        return orders.stream().map(this::mapSalesOrderToDto).collect(Collectors.toList());
    }

    public SalesOrderDto getSalesOrderById(Long id) {
        SalesOrder so = salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + id));
        return mapSalesOrderToDto(so);
    }

    @Transactional
    public SalesOrderDto createSalesOrder(SalesOrderCreateRequest req, String currentActor) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item.");
        }

        Location location = locationRepository.findById(req.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));

        // Validate stock availability for all items before any deduction
        for (OrderItemRequest itemReq : req.getItems()) {
            Product p = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + itemReq.getProductId()));
            Inventory inv = inventoryRepository.findByProductAndLocation(p, location)
                    .orElseThrow(() -> new IllegalArgumentException("No stock found for " + p.getName() + " at " + location.getName()));

            int available = inv.getAvailableStock() != null ? inv.getAvailableStock() : 0;
            if (available < itemReq.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + p.getName() + " at " + location.getName() +
                        ". Available: " + available + ", Requested: " + itemReq.getQuantity());
            }
        }

        String orderNumber = "SO-" + System.currentTimeMillis();
        SalesOrder salesOrder = SalesOrder.builder()
                .orderNumber(orderNumber)
                .customerName(req.getCustomerName() != null ? req.getCustomerName() : "Walk-in Customer")
                .location(location)
                .status(OrderStatus.COMPLETED) // immediate confirmation & stock deduction
                .createdBy(currentActor)
                .orderDate(LocalDateTime.now())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<SalesOrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : req.getItems()) {
            Product p = productRepository.findById(itemReq.getProductId()).get();
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : p.getSellingPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            SalesOrderItem soi = SalesOrderItem.builder()
                    .salesOrder(salesOrder)
                    .product(p)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();
            items.add(soi);

            // Deduct stock
            Inventory inv = inventoryRepository.findByProductAndLocation(p, location).get();
            int newAvailable = inv.getAvailableStock() - itemReq.getQuantity();
            inv.setAvailableStock(newAvailable);
            inventoryRepository.save(inv);

            // Record movement
            StockMovement movement = StockMovement.builder()
                    .product(p)
                    .location(location)
                    .movementType(MovementType.SALES_DEDUCTION)
                    .quantity(-itemReq.getQuantity())
                    .referenceType("SALES_ORDER")
                    .referenceNumber(orderNumber)
                    .notes("Sold to " + salesOrder.getCustomerName())
                    .performedBy(currentActor)
                    .createdAt(LocalDateTime.now())
                    .build();
            stockMovementRepository.save(movement);

            // Low stock alert check
            if (newAvailable <= inv.getReorderLevel()) {
                notificationService.notify("Low Stock Warning",
                        "Stock for " + p.getName() + " at " + location.getName() + " dropped to " + newAvailable +
                                " (Reorder Level: " + inv.getReorderLevel() + ")",
                        "WARNING", null);
            }
        }

        salesOrder.setTotalAmount(totalAmount);
        salesOrder.setItems(items);
        salesOrder = salesOrderRepository.save(salesOrder);

        auditLogService.record(currentActor, "SALES_ORDER_CREATED", "SALES_ORDER", orderNumber,
                "Sales Order " + orderNumber + " created for " + salesOrder.getCustomerName() + " (Total: ₹ " + totalAmount + ")");

        SalesOrderDto dto = mapSalesOrderToDto(salesOrder);
        webSocketService.broadcastStockChange(dto);
        return dto;
    }

    @Transactional
    public SalesOrderDto updateSalesOrderStatus(Long id, OrderStatus newStatus, String currentActor) {
        SalesOrder so = salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + id));

        OrderStatus oldStatus = so.getStatus();
        if (oldStatus == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot change status of a cancelled order.");
        }

        so.setStatus(newStatus);
        so = salesOrderRepository.save(so);

        auditLogService.record(currentActor, "SALES_ORDER_STATUS_CHANGED", "SALES_ORDER", so.getOrderNumber(),
                "Sales Order " + so.getOrderNumber() + " status changed: " + oldStatus + " -> " + newStatus);

        return mapSalesOrderToDto(so);
    }

    // ==========================================
    // PURCHASE ORDERS
    // ==========================================

    public List<PurchaseOrderDto> getPurchaseOrders(PurchaseOrderStatus status, String search) {
        List<PurchaseOrder> pos = purchaseOrderRepository.searchPurchaseOrders(status, search);
        return pos.stream().map(this::mapPurchaseOrderToDto).collect(Collectors.toList());
    }

    public PurchaseOrderDto getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found with id: " + id));
        return mapPurchaseOrderToDto(po);
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderCreateRequest req, String currentActor) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase order must contain at least one item.");
        }

        Supplier supplier = supplierRepository.findById(req.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        Location location = locationRepository.findById(req.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Destination location not found"));

        String poNumber = "PO-" + System.currentTimeMillis();
        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .destinationLocation(location)
                .status(PurchaseOrderStatus.ORDERED)
                .createdBy(currentActor)
                .orderDate(LocalDateTime.now())
                .expectedDeliveryDate(req.getExpectedDeliveryDate() != null ? req.getExpectedDeliveryDate().atStartOfDay() : LocalDateTime.now().plusDays(7))
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : req.getItems()) {
            Product p = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : p.getPurchasePrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(subtotal);

            PurchaseOrderItem poi = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(p)
                    .quantity(itemReq.getQuantity())
                    .receivedQuantity(0)
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();
            items.add(poi);
        }

        po.setTotalAmount(total);
        po.setItems(items);
        po = purchaseOrderRepository.save(po);

        auditLogService.record(currentActor, "PURCHASE_ORDER_CREATED", "PURCHASE_ORDER", poNumber,
                "Purchase Order " + poNumber + " created for supplier " + supplier.getName() + " (Total: ₹ " + total + ")");

        notificationService.notify("Purchase Order Placed",
                "PO " + poNumber + " placed with " + supplier.getName() + " for " + location.getName(),
                "INFO", null);

        return mapPurchaseOrderToDto(po);
    }

    @Transactional
    public PurchaseOrderDto receiveGoods(ReceivePoRequest req, String currentActor) {
        PurchaseOrder po = purchaseOrderRepository.findById(req.getPoId())
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found with id: " + req.getPoId()));

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED || po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot receive items for an order in status: " + po.getStatus());
        }

        boolean allItemsFullyReceived = true;
        Location location = po.getDestinationLocation();

        for (ReceivePoItemRequest itemReq : req.getItems()) {
            PurchaseOrderItem poi = purchaseOrderItemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Purchase order item not found"));

            int newlyReceived = itemReq.getReceiveQuantity();
            if (newlyReceived <= 0) {
                continue;
            }

            int alreadyReceived = poi.getReceivedQuantity() != null ? poi.getReceivedQuantity() : 0;
            int totalAfter = alreadyReceived + newlyReceived;
            if (totalAfter > poi.getQuantity()) {
                throw new IllegalArgumentException("Cannot receive more than ordered quantity (" + poi.getQuantity() +
                        ") for product: " + poi.getProduct().getName() + ". Already received: " + alreadyReceived + ", Attempted: " + newlyReceived);
            }

            poi.setReceivedQuantity(totalAfter);
            purchaseOrderItemRepository.save(poi);

            // Increase stock in destination location
            Inventory inv = inventoryRepository.findByProductAndLocation(poi.getProduct(), location)
                    .orElseGet(() -> Inventory.builder()
                            .product(poi.getProduct())
                            .location(location)
                            .availableStock(0)
                            .reservedStock(0)
                            .reorderLevel(poi.getProduct().getReorderLevel())
                            .build());

            int oldStock = inv.getAvailableStock() != null ? inv.getAvailableStock() : 0;
            inv.setAvailableStock(oldStock + newlyReceived);
            inventoryRepository.save(inv);

            // Record stock movement
            StockMovement movement = StockMovement.builder()
                    .product(poi.getProduct())
                    .location(location)
                    .movementType(MovementType.PURCHASE_RECEIPT)
                    .quantity(newlyReceived)
                    .referenceType("PURCHASE_ORDER")
                    .referenceNumber(po.getPoNumber())
                    .notes("Received from supplier: " + po.getSupplier().getName())
                    .performedBy(currentActor)
                    .createdAt(LocalDateTime.now())
                    .build();
            stockMovementRepository.save(movement);
        }

        // Verify if all items are fully received
        for (PurchaseOrderItem poi : po.getItems()) {
            int received = poi.getReceivedQuantity() != null ? poi.getReceivedQuantity() : 0;
            if (received < poi.getQuantity()) {
                allItemsFullyReceived = false;
                break;
            }
        }

        if (allItemsFullyReceived) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }

        po = purchaseOrderRepository.save(po);

        auditLogService.record(currentActor, "GOODS_RECEIVED", "PURCHASE_ORDER", po.getPoNumber(),
                "Received goods for PO " + po.getPoNumber() + " at " + location.getName() + ". Status: " + po.getStatus());

        notificationService.notify("Goods Received",
                "Goods received for PO " + po.getPoNumber() + " at " + location.getName() + " by " + currentActor,
                "SUCCESS", null);

        PurchaseOrderDto dto = mapPurchaseOrderToDto(po);
        webSocketService.broadcastStockChange(dto);
        return dto;
    }

    public SalesOrderDto mapSalesOrderToDto(SalesOrder so) {
        List<SalesOrderItemDto> itemDtos = so.getItems().stream()
                .map(i -> SalesOrderItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .sku(i.getProduct().getSku())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return SalesOrderDto.builder()
                .id(so.getId())
                .orderNumber(so.getOrderNumber())
                .customerName(so.getCustomerName())
                .locationId(so.getLocation().getId())
                .locationName(so.getLocation().getName())
                .status(so.getStatus().name())
                .totalAmount(so.getTotalAmount())
                .orderDate(so.getOrderDate())
                .createdBy(so.getCreatedBy())
                .items(itemDtos)
                .build();
    }

    public PurchaseOrderDto mapPurchaseOrderToDto(PurchaseOrder po) {
        List<PurchaseOrderItemDto> itemDtos = po.getItems().stream()
                .map(i -> PurchaseOrderItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .sku(i.getProduct().getSku())
                        .quantity(i.getQuantity())
                        .receivedQuantity(i.getReceivedQuantity() != null ? i.getReceivedQuantity() : 0)
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return PurchaseOrderDto.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierId(po.getSupplier().getId())
                .supplierName(po.getSupplier().getName())
                .locationId(po.getDestinationLocation().getId())
                .locationName(po.getDestinationLocation().getName())
                .status(po.getStatus().name())
                .totalAmount(po.getTotalAmount())
                .orderDate(po.getOrderDate())
                .createdBy(po.getCreatedBy())
                .items(itemDtos)
                .build();
    }
}
