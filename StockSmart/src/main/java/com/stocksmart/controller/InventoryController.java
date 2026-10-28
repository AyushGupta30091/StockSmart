package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.InventoryDto;
import com.stocksmart.dto.AppDtos.StockAdjustmentRequest;
import com.stocksmart.dto.AppDtos.StockTransferRequest;
import com.stocksmart.model.User;
import com.stocksmart.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryDto>> getInventory(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long locationId) {
        return ResponseEntity.ok(inventoryService.getInventory(productId, locationId));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryDto>> getLowStock() {
        return ResponseEntity.ok(inventoryService.getLowStockInventories());
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryDto> adjustStock(
            @RequestBody StockAdjustmentRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(inventoryService.adjustStock(req, actor));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transferStock(
            @RequestBody StockTransferRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        inventoryService.transferStock(req, actor);
        return ResponseEntity.ok().build();
    }
}
