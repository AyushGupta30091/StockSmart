package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.InventoryDto;
import com.stocksmart.dto.AppDtos.StockAdjustmentRequest;
import com.stocksmart.dto.AppDtos.StockTransferRequest;
import com.stocksmart.model.*;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final WebSocketNotificationService webSocketService;

    public List<InventoryDto> getInventory(Long productId, Long locationId) {
        List<Inventory> list;
        if (productId != null && locationId != null) {
            list = inventoryRepository.findByProductIdAndLocationId(productId, locationId)
                    .map(List::of).orElse(List.of());
        } else if (productId != null) {
            list = inventoryRepository.findByProductId(productId);
        } else if (locationId != null) {
            list = inventoryRepository.findByLocationId(locationId);
        } else {
            list = inventoryRepository.findAll();
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<InventoryDto> getLowStockInventories() {
        return inventoryRepository.findLowStockInventories().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryDto adjustStock(StockAdjustmentRequest req, String currentActor) {
        if (req.getNewStock() < 0) {
            throw new IllegalArgumentException("Stock cannot be negative.");
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        Location location = locationRepository.findById(req.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));

        Inventory inv = inventoryRepository.findByProductAndLocation(product, location)
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .location(location)
                        .availableStock(0)
                        .reservedStock(0)
                        .reorderLevel(product.getReorderLevel())
                        .build());

        int oldStock = inv.getAvailableStock() != null ? inv.getAvailableStock() : 0;
        int diff = req.getNewStock() - oldStock;
        inv.setAvailableStock(req.getNewStock());
        inv = inventoryRepository.save(inv);

        // Record stock movement
        StockMovement movement = StockMovement.builder()
                .product(product)
                .location(location)
                .movementType(MovementType.MANUAL_ADJUSTMENT)
                .quantity(diff)
                .referenceType("ADJUSTMENT")
                .referenceNumber("ADJ-" + System.currentTimeMillis())
                .notes(req.getReason() != null ? req.getReason() : "Manual stock adjustment")
                .performedBy(currentActor)
                .createdAt(LocalDateTime.now())
                .build();
        stockMovementRepository.save(movement);

        // Audit log
        auditLogService.record(currentActor, "STOCK_ADJUSTMENT", "INVENTORY", String.valueOf(inv.getId()),
                "Stock adjusted for " + product.getName() + " at " + location.getName() + ": " + oldStock + " -> " + req.getNewStock());

        // Check if low stock
        if (req.getNewStock() <= inv.getReorderLevel()) {
            notificationService.notify("Low Stock Warning",
                    "Stock for " + product.getName() + " at " + location.getName() + " is low (" + req.getNewStock() + " remaining)",
                    "WARNING", null);
        }

        InventoryDto dto = mapToDto(inv);
        webSocketService.broadcastStockChange(dto);
        return dto;
    }

    @Transactional
    public void transferStock(StockTransferRequest req, String currentActor) {
        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero.");
        }
        if (req.getSourceLocationId().equals(req.getDestinationLocationId())) {
            throw new IllegalArgumentException("Source and destination locations must be different.");
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        Location source = locationRepository.findById(req.getSourceLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Source location not found"));
        Location dest = locationRepository.findById(req.getDestinationLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Destination location not found"));

        Inventory srcInv = inventoryRepository.findByProductAndLocation(product, source)
                .orElseThrow(() -> new IllegalArgumentException("No inventory found at source location: " + source.getName()));

        int currentAvailable = srcInv.getAvailableStock() != null ? srcInv.getAvailableStock() : 0;
        if (currentAvailable < req.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock at " + source.getName() +
                    ". Available: " + currentAvailable + ", Requested: " + req.getQuantity());
        }

        Inventory destInv = inventoryRepository.findByProductAndLocation(product, dest)
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .location(dest)
                        .availableStock(0)
                        .reservedStock(0)
                        .reorderLevel(product.getReorderLevel())
                        .build());

        // Deduct from source
        srcInv.setAvailableStock(currentAvailable - req.getQuantity());
        inventoryRepository.save(srcInv);

        // Add to destination
        int destAvailable = destInv.getAvailableStock() != null ? destInv.getAvailableStock() : 0;
        destInv.setAvailableStock(destAvailable + req.getQuantity());
        inventoryRepository.save(destInv);

        String refNum = "TRF-" + System.currentTimeMillis();

        // Record movements
        StockMovement outMove = StockMovement.builder()
                .product(product)
                .location(source)
                .movementType(MovementType.TRANSFER_OUT)
                .quantity(-req.getQuantity())
                .referenceType("TRANSFER")
                .referenceNumber(refNum)
                .notes("Transferred to " + dest.getName() + ". " + (req.getNotes() != null ? req.getNotes() : ""))
                .performedBy(currentActor)
                .createdAt(LocalDateTime.now())
                .build();
        stockMovementRepository.save(outMove);

        StockMovement inMove = StockMovement.builder()
                .product(product)
                .location(dest)
                .movementType(MovementType.TRANSFER_IN)
                .quantity(req.getQuantity())
                .referenceType("TRANSFER")
                .referenceNumber(refNum)
                .notes("Transferred from " + source.getName() + ". " + (req.getNotes() != null ? req.getNotes() : ""))
                .performedBy(currentActor)
                .createdAt(LocalDateTime.now())
                .build();
        stockMovementRepository.save(inMove);

        // Audit log
        auditLogService.record(currentActor, "STOCK_TRANSFER", "INVENTORY", refNum,
                "Transferred " + req.getQuantity() + " units of " + product.getName() +
                        " from " + source.getName() + " to " + dest.getName());

        // Low stock warning for source if necessary
        if (srcInv.getAvailableStock() <= srcInv.getReorderLevel()) {
            notificationService.notify("Low Stock Alert",
                    product.getName() + " at " + source.getName() + " is now low on stock (" + srcInv.getAvailableStock() + " remaining)",
                    "WARNING", null);
        }

        webSocketService.broadcastStockChange(mapToDto(srcInv));
        webSocketService.broadcastStockChange(mapToDto(destInv));
    }

    public InventoryDto mapToDto(Inventory inv) {
        int avail = inv.getAvailableStock() != null ? inv.getAvailableStock() : 0;
        int reorder = inv.getReorderLevel() != null ? inv.getReorderLevel() : 10;
        String status = "In Stock";
        if (avail == 0) {
            status = "Out of Stock";
        } else if (avail <= reorder) {
            status = "Low Stock";
        }

        return InventoryDto.builder()
                .id(inv.getId())
                .productId(inv.getProduct().getId())
                .productName(inv.getProduct().getName())
                .sku(inv.getProduct().getSku())
                .locationId(inv.getLocation().getId())
                .locationName(inv.getLocation().getName())
                .availableStock(avail)
                .reservedStock(inv.getReservedStock() != null ? inv.getReservedStock() : 0)
                .reorderLevel(reorder)
                .status(status)
                .build();
    }
}
