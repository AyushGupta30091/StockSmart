package com.stocksmart.dto;

import com.stocksmart.model.Role;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AppDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private Long id;
        private String email;
        private String fullName;
        private Role role;
        private Long locationId;
        private String locationName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;
        private Role role;
        private Long locationId;
        private String locationName;
        private Boolean active;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserCreateRequest {
        private String email;
        private String password;
        private String fullName;
        private Role role;
        private Long locationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserUpdateRequest {
        private String fullName;
        private Role role;
        private Long locationId;
        private Boolean active;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryDto {
        private Long id;
        private String name;
        private String description;
        private Boolean active;
        private Integer productCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationDto {
        private Long id;
        private String name;
        private String code;
        private String address;
        private String type;
        private Boolean active;
        private Integer totalStock;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SupplierDto {
        private Long id;
        private String name;
        private String contactPerson;
        private String email;
        private String phone;
        private String address;
        private String productsSupplied;
        private Boolean active;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductDto {
        private Long id;
        private String name;
        private String sku;
        private String barcode;
        private String description;
        private Long categoryId;
        private String categoryName;
        private String imageUrl;
        private BigDecimal purchasePrice;
        private BigDecimal sellingPrice;
        private Integer reorderLevel;
        private Boolean active;
        private Integer totalStock;
        private String status; // "In Stock", "Low Stock", "Out of Stock"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductCreateRequest {
        private String name;
        private String sku;
        private String barcode;
        private String description;
        private Long categoryId;
        private String imageUrl;
        private BigDecimal purchasePrice;
        private BigDecimal sellingPrice;
        private Integer reorderLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryDto {
        private Long id;
        private Long productId;
        private String productName;
        private String sku;
        private Long locationId;
        private String locationName;
        private Integer availableStock;
        private Integer reservedStock;
        private Integer reorderLevel;
        private String status; // "In Stock", "Low Stock", "Out of Stock"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockAdjustmentRequest {
        private Long productId;
        private Long locationId;
        private Integer newStock;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockTransferRequest {
        private Long productId;
        private Long sourceLocationId;
        private Long destinationLocationId;
        private Integer quantity;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesOrderCreateRequest {
        private String customerName;
        private Long locationId;
        private List<OrderItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesOrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesOrderDto {
        private Long id;
        private String orderNumber;
        private String customerName;
        private Long locationId;
        private String locationName;
        private String status;
        private BigDecimal totalAmount;
        private LocalDateTime orderDate;
        private String createdBy;
        private List<SalesOrderItemDto> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PurchaseOrderCreateRequest {
        private Long supplierId;
        private Long locationId;
        private java.time.LocalDate expectedDeliveryDate;
        private List<OrderItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PurchaseOrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;
        private Integer receivedQuantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PurchaseOrderDto {
        private Long id;
        private String poNumber;
        private Long supplierId;
        private String supplierName;
        private Long locationId;
        private String locationName;
        private String status;
        private BigDecimal totalAmount;
        private LocalDateTime orderDate;
        private String createdBy;
        private List<PurchaseOrderItemDto> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReceivePoItemRequest {
        private Long itemId;
        private Integer receiveQuantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReceivePoRequest {
        private Long poId;
        private List<ReceivePoItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BarcodeLookupResponse {
        private boolean found;
        private ProductDto product;
        private List<InventoryDto> locationStocks;
        private Integer totalStock;
        private String overallStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RfidTagDto {
        private Long id;
        private String tagId;
        private Long productId;
        private String productName;
        private String sku;
        private Long locationId;
        private String locationName;
        private String status;
        private LocalDateTime lastScannedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardKpiDto {
        private long totalProducts;
        private String productsChange;
        private BigDecimal totalStockValue;
        private String stockValueChange;
        private long pendingOrders;
        private String pendingOrdersChange;
        private long lowStockCount;
        private String lowStockNote;
        private List<LocationStockStat> stockByLocation;
        private List<CategoryStat> categoryDistribution;
        private List<DailySalesStat> salesTrends;
        private List<TopProductStat> topSellingProducts;
        private List<ProductDto> lowStockProducts;
        private List<SalesOrderDto> recentTransactions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationStockStat {
        private String location;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryStat {
        private String category;
        private long count;
        private double percentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailySalesStat {
        private String date;
        private BigDecimal amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductStat {
        private String name;
        private long quantitySold;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogDto {
        private Long id;
        private String actor;
        private String action;
        private String entityType;
        private String entityId;
        private String description;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationDto {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String targetRole;
        private Boolean readStatus;
        private LocalDateTime createdAt;
    }
}
