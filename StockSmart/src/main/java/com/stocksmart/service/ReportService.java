package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.DashboardKpiDto;
import com.stocksmart.dto.AppDtos.InventoryDto;
import com.stocksmart.dto.AppDtos.ProductDto;
import com.stocksmart.dto.AppDtos.SupplierDto;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.SalesOrderRepository;
import com.stocksmart.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final SupplierService supplierService;
    private final DashboardService dashboardService;

    public Map<String, Object> getReportsData() {
        Map<String, Object> reports = new HashMap<>();

        DashboardKpiDto kpis = dashboardService.getDashboardStats();
        reports.put("kpis", kpis);

        // Inventory valuation
        BigDecimal totalValuation = inventoryRepository.getTotalStockValuation();
        reports.put("totalStockValuation", totalValuation != null ? totalValuation : BigDecimal.ZERO);

        // Low stock items
        List<InventoryDto> lowStock = inventoryService.getLowStockInventories();
        reports.put("lowStockItems", lowStock);

        // Supplier performance
        List<SupplierDto> suppliers = supplierService.getAllSuppliers();
        reports.put("suppliers", suppliers);

        // All inventory detailed
        List<InventoryDto> allInventory = inventoryService.getInventory(null, null);
        reports.put("allInventory", allInventory);

        return reports;
    }
}
