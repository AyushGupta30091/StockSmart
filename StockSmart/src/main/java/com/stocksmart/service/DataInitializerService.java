package com.stocksmart.service;

import com.stocksmart.model.*;
import com.stocksmart.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataInitializerService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final RFIDTagRepository rfidTagRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing StockSmart default data...");

        // 1. Locations
        Location mainStore = initLocation("Main Store", "MAIN", "124 Market Road, City Center", "STORE");
        Location warehouseA = initLocation("Warehouse A", "WHA", "Plot 45 Logistics Hub", "WAREHOUSE");
        Location storeB = initLocation("Store B", "STRB", "78 West Mall Boulevard", "STORE");
        Location storeC = initLocation("Store C", "STRC", "12 East Avenue Commercial", "STORE");

        // 2. Users (BCrypt encoded)
        initUser("admin@stocksmart.com", "admin123", "Admin User", Role.ADMIN, mainStore);
        initUser("manager@stocksmart.com", "Manager@123", "Priya Sharma (Manager)", Role.MANAGER, mainStore);
        initUser("staff@stocksmart.com", "Staff@123", "Rahul Verma (Staff)", Role.STAFF, mainStore);

        // 3. Categories
        Category electronics = initCategory("Electronics", "Computers, audio, and accessories");
        Category apparel = initCategory("Apparel", "Clothing, fashion, and wearables");
        Category grocery = initCategory("Grocery", "Daily foods, staples, and groceries");
        Category homeKitchen = initCategory("Home & Kitchen", "Bottles, cookware, and home items");
        Category others = initCategory("Others", "Miscellaneous products and supplies");

        // 4. Suppliers
        Supplier techDist = initSupplier("Tech Distributors", "Rahul Sharma", "rahul@techdist.com", "9876543210", "Tech Park, Bengaluru", "Electronics");
        Supplier fashionHub = initSupplier("Fashion Hub", "Priya Mehta", "priya@fashionhub.com", "9876543211", "Fashion Avenue, Mumbai", "Apparel");
        Supplier freshFoods = initSupplier("Fresh Foods Ltd", "Amit Verma", "amit@freshfoods.com", "9876543212", "Green Valley, Punjab", "Grocery");
        Supplier homeEss = initSupplier("Home Essentials", "Sneha Gupta", "sneha@homeess.com", "9876543213", "Industrial Area, Delhi", "Home & Kitchen");

        // 5. Products
        Product mouse = initProduct("Wireless Mouse", "ELEC001", "8901234001", "Ergonomic 2.4GHz optical wireless mouse",
                electronics, "/assets/images/mouse.png", new BigDecimal("500.00"), new BigDecimal("799.00"), 20);

        Product tshirt = initProduct("Cotton T-Shirt", "APP002", "8901234002", "100% combed cotton round-neck tee",
                apparel, "/assets/images/tshirt.png", new BigDecimal("300.00"), new BigDecimal("499.00"), 15);

        Product rice = initProduct("Rice 5kg", "GRO003", "8901234003", "Premium aged long-grain basmati rice",
                grocery, "/assets/images/rice.png", new BigDecimal("220.00"), new BigDecimal("320.00"), 50);

        Product bottle = initProduct("Water Bottle", "HOM004", "8901234004", "Stainless steel vacuum insulated 1L bottle",
                homeKitchen, "/assets/images/bottle.png", new BigDecimal("180.00"), new BigDecimal("299.00"), 10);

        Product speaker = initProduct("Bluetooth Speaker", "ELEC005", "8901234005", "Portable wireless speaker with deep bass",
                electronics, "/assets/images/speaker.png", new BigDecimal("850.00"), new BigDecimal("1299.00"), 15);

        // 6. Multi-location Inventory (Matching reference image 4 exactly!)
        // Wireless Mouse: Main Store: 50, Warehouse A: 30, Store B: 25, Store C: 15 (Total 120)
        initInventory(mouse, mainStore, 50, 10, 20);
        initInventory(mouse, warehouseA, 30, 5, 20);
        initInventory(mouse, storeB, 25, 0, 15);
        initInventory(mouse, storeC, 15, 5, 15);

        // Cotton T-Shirt: Total 85
        initInventory(tshirt, mainStore, 40, 5, 15);
        initInventory(tshirt, warehouseA, 30, 0, 15);
        initInventory(tshirt, storeB, 15, 0, 10);
        initInventory(tshirt, storeC, 0, 0, 10);

        // Rice 5kg: Total 40 (Low Stock)
        initInventory(rice, mainStore, 20, 0, 50);
        initInventory(rice, warehouseA, 10, 0, 25);
        initInventory(rice, storeB, 10, 0, 20);
        initInventory(rice, storeC, 0, 0, 10);

        // Water Bottle: Total 0 (Out of Stock)
        initInventory(bottle, mainStore, 0, 0, 10);
        initInventory(bottle, warehouseA, 0, 0, 10);
        initInventory(bottle, storeB, 0, 0, 10);
        initInventory(bottle, storeC, 0, 0, 10);

        // Bluetooth Speaker: Total 60
        initInventory(speaker, mainStore, 30, 0, 15);
        initInventory(speaker, warehouseA, 20, 0, 15);
        initInventory(speaker, storeB, 10, 0, 10);
        initInventory(speaker, storeC, 0, 0, 10);

        // 7. Initial Sales Orders (matching reference image 5)
        initSalesOrder("SO-2026-001", "Walk-in Customer", mainStore, OrderStatus.COMPLETED, new BigDecimal("2099.00"), "admin@stocksmart.com", LocalDateTime.now().minusDays(2));
        initSalesOrder("SO-2026-002", "Retail Mart", mainStore, OrderStatus.PROCESSING, new BigDecimal("5499.00"), "manager@stocksmart.com", LocalDateTime.now().minusDays(3));
        initSalesOrder("SO-2026-003", "Tech Store", warehouseA, OrderStatus.SHIPPED, new BigDecimal("1999.00"), "staff@stocksmart.com", LocalDateTime.now().minusDays(3));
        initSalesOrder("SO-2026-004", "Local Customer", storeB, OrderStatus.COMPLETED, new BigDecimal("799.00"), "admin@stocksmart.com", LocalDateTime.now().minusDays(4));
        initSalesOrder("SO-2026-005", "Mega Retail", mainStore, OrderStatus.PENDING, new BigDecimal("12499.00"), "staff@stocksmart.com", LocalDateTime.now().minusDays(4));

        // 8. RFID Tags
        initRfidTag("RFID-ELEC001-001", mouse, mainStore);
        initRfidTag("RFID-APP002-001", tshirt, mainStore);
        initRfidTag("RFID-GRO003-001", rice, mainStore);

        // 9. Initial Notifications & Audit Logs
        if (notificationRepository.count() == 0) {
            notificationRepository.save(Notification.builder()
                    .title("System Initialized")
                    .message("StockSmart Inventory Optimization system is ready for operations.")
                    .type("SUCCESS")
                    .readStatus(false)
                    .createdAt(LocalDateTime.now().minusHours(1))
                    .build());

            notificationRepository.save(Notification.builder()
                    .title("Low Stock Alert")
                    .message("Rice 5kg is currently below the reorder threshold (40 available, reorder level 50).")
                    .type("WARNING")
                    .readStatus(false)
                    .createdAt(LocalDateTime.now().minusMinutes(30))
                    .build());
        }

        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(AuditLog.builder()
                    .actor("system@stocksmart.com")
                    .action("SYSTEM_INIT")
                    .entityType("SYSTEM")
                    .entityId("INIT")
                    .description("Seed data and initial catalog initialized successfully")
                    .timestamp(LocalDateTime.now().minusHours(2))
                    .build());
        }

        log.info("StockSmart data initialization completed successfully.");
    }

    private Location initLocation(String name, String code, String address, String type) {
        return locationRepository.findByName(name).orElseGet(() ->
                locationRepository.save(Location.builder()
                        .name(name)
                        .code(code)
                        .address(address)
                        .type(type)
                        .active(true)
                        .build()));
    }

    private void initUser(String email, String rawPassword, String fullName, Role role, Location loc) {
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            userRepository.save(User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .fullName(fullName)
                    .role(role)
                    .location(loc)
                    .active(true)
                    .build());
            log.info("Initialized user: {} with role {}", email, role);
        }
    }

    private Category initCategory(String name, String desc) {
        return categoryRepository.findByName(name).orElseGet(() ->
                categoryRepository.save(Category.builder()
                        .name(name)
                        .description(desc)
                        .active(true)
                        .build()));
    }

    private Supplier initSupplier(String name, String contact, String email, String phone, String address, String products) {
        return supplierRepository.findByName(name).orElseGet(() ->
                supplierRepository.save(Supplier.builder()
                        .name(name)
                        .contactPerson(contact)
                        .email(email)
                        .phone(phone)
                        .address(address)
                        .productsSupplied(products)
                        .active(true)
                        .build()));
    }

    private Product initProduct(String name, String sku, String barcode, String desc,
                                Category cat, String img, BigDecimal buy, BigDecimal sell, int reorder) {
        return productRepository.findBySku(sku).orElseGet(() ->
                productRepository.save(Product.builder()
                        .name(name)
                        .sku(sku)
                        .barcode(barcode)
                        .description(desc)
                        .category(cat)
                        .imageUrl(img)
                        .purchasePrice(buy)
                        .sellingPrice(sell)
                        .reorderLevel(reorder)
                        .active(true)
                        .build()));
    }

    private void initInventory(Product p, Location loc, int available, int reserved, int reorder) {
        inventoryRepository.findByProductAndLocation(p, loc).orElseGet(() ->
                inventoryRepository.save(Inventory.builder()
                        .product(p)
                        .location(loc)
                        .availableStock(available)
                        .reservedStock(reserved)
                        .reorderLevel(reorder)
                        .build()));
    }

    private void initSalesOrder(String orderNum, String customer, Location loc, OrderStatus status, BigDecimal total, String user, LocalDateTime date) {
        if (salesOrderRepository.findByOrderNumber(orderNum).isEmpty()) {
            salesOrderRepository.save(SalesOrder.builder()
                    .orderNumber(orderNum)
                    .customerName(customer)
                    .location(loc)
                    .status(status)
                    .totalAmount(total)
                    .createdBy(user)
                    .orderDate(date)
                    .build());
        }
    }

    private void initRfidTag(String tagId, Product p, Location loc) {
        if (!rfidTagRepository.existsByTagId(tagId)) {
            rfidTagRepository.save(RFIDTag.builder()
                    .tagId(tagId)
                    .product(p)
                    .location(loc)
                    .status("ACTIVE")
                    .lastScannedAt(LocalDateTime.now().minusDays(1))
                    .build());
        }
    }
}
