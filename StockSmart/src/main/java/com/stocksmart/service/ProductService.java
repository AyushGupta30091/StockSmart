package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.ProductCreateRequest;
import com.stocksmart.dto.AppDtos.ProductDto;
import com.stocksmart.model.Category;
import com.stocksmart.model.Inventory;
import com.stocksmart.model.Location;
import com.stocksmart.model.Product;
import com.stocksmart.repository.CategoryRepository;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final WebSocketNotificationService webSocketService;

    public List<ProductDto> getProducts(Long categoryId, String search) {
        List<Product> products = productRepository.searchProducts(categoryId, search);
        return products.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ProductDto getProductById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        return mapToDto(p);
    }

    public ProductDto getProductBySku(String sku) {
        Product p = productRepository.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with SKU: " + sku));
        return mapToDto(p);
    }

    @Transactional
    public ProductDto createProduct(ProductCreateRequest req, String currentActor, String actorRole) {
        if (productRepository.existsBySku(req.getSku().trim())) {
            throw new IllegalArgumentException("A product with SKU '" + req.getSku() + "' already exists.");
        }
        if (req.getBarcode() != null && productRepository.existsByBarcode(req.getBarcode().trim())) {
            throw new IllegalArgumentException("A product with Barcode '" + req.getBarcode() + "' already exists.");
        }

        Category category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId()).orElse(null);
        }

        Product product = Product.builder()
                .name(req.getName().trim())
                .sku(req.getSku().trim().toUpperCase())
                .barcode(req.getBarcode() != null ? req.getBarcode().trim() : req.getSku().trim())
                .description(req.getDescription())
                .category(category)
                .imageUrl(req.getImageUrl())
                .purchasePrice(req.getPurchasePrice())
                .sellingPrice(req.getSellingPrice())
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10)
                .active(true)
                .build();

        product = productRepository.save(product);

        // Initialize inventory slots across standard locations
        List<Location> locations = locationRepository.findAll();
        for (Location loc : locations) {
            Inventory inv = Inventory.builder()
                    .product(product)
                    .location(loc)
                    .availableStock(0)
                    .reservedStock(0)
                    .reorderLevel(product.getReorderLevel())
                    .build();
            inventoryRepository.save(inv);
        }

        ProductDto dto = mapToDto(product);

        // Audit log
        auditLogService.record(currentActor, "PRODUCT_CREATED", "PRODUCT", String.valueOf(product.getId()),
                "Product created: " + product.getName() + " (SKU: " + product.getSku() + ") by " + currentActor);

        // Compulsory Section 6: Real-time Staff -> Manager -> Admin notifications and live update
        String notificationTitle = "New Product Added";
        String notificationMsg = (actorRole != null && actorRole.equalsIgnoreCase("STAFF") ? "Staff member " : "")
                + currentActor + " created product: " + product.getName() + " (" + product.getSku() + ")";

        notificationService.notify(notificationTitle, notificationMsg, "INFO", null);
        webSocketService.broadcastProductChange("CREATE", dto);

        return dto;
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductCreateRequest req, String currentActor) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        if (!p.getSku().equalsIgnoreCase(req.getSku().trim())) {
            Optional<Product> existing = productRepository.findBySku(req.getSku().trim());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new IllegalArgumentException("SKU '" + req.getSku() + "' is already in use by another product.");
            }
            p.setSku(req.getSku().trim().toUpperCase());
        }

        if (req.getBarcode() != null && !req.getBarcode().equalsIgnoreCase(p.getBarcode())) {
            Optional<Product> existing = productRepository.findByBarcode(req.getBarcode().trim());
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new IllegalArgumentException("Barcode '" + req.getBarcode() + "' is already in use.");
            }
            p.setBarcode(req.getBarcode().trim());
        }

        p.setName(req.getName().trim());
        p.setDescription(req.getDescription());
        if (req.getCategoryId() != null) {
            Category cat = categoryRepository.findById(req.getCategoryId()).orElse(null);
            p.setCategory(cat);
        }
        p.setImageUrl(req.getImageUrl());
        p.setPurchasePrice(req.getPurchasePrice());
        p.setSellingPrice(req.getSellingPrice());
        p.setReorderLevel(req.getReorderLevel());

        p = productRepository.save(p);

        ProductDto dto = mapToDto(p);

        auditLogService.record(currentActor, "PRODUCT_UPDATED", "PRODUCT", String.valueOf(p.getId()),
                "Product updated: " + p.getName() + " (SKU: " + p.getSku() + ")");

        webSocketService.broadcastProductChange("UPDATE", dto);

        return dto;
    }

    @Transactional
    public void deleteProduct(Long id, String currentActor) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        p.setActive(false);
        productRepository.save(p);

        auditLogService.record(currentActor, "PRODUCT_DEACTIVATED", "PRODUCT", String.valueOf(p.getId()),
                "Product deactivated: " + p.getName() + " (SKU: " + p.getSku() + ")");

        webSocketService.broadcastProductChange("DELETE", mapToDto(p));
    }

    public ProductDto mapToDto(Product p) {
        Integer totalStock = inventoryRepository.getTotalStockByProductId(p.getId());
        if (totalStock == null) totalStock = 0;

        String status = "In Stock";
        if (totalStock == 0) {
            status = "Out of Stock";
        } else if (totalStock <= p.getReorderLevel()) {
            status = "Low Stock";
        }

        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .barcode(p.getBarcode())
                .description(p.getDescription())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Unassigned")
                .imageUrl(p.getImageUrl())
                .purchasePrice(p.getPurchasePrice())
                .sellingPrice(p.getSellingPrice())
                .reorderLevel(p.getReorderLevel())
                .active(p.getActive())
                .totalStock(totalStock)
                .status(status)
                .build();
    }
}
