package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.*;
import com.stocksmart.model.OrderStatus;
import com.stocksmart.model.PurchaseOrderStatus;
import com.stocksmart.model.User;
import com.stocksmart.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // Sales Orders
    @GetMapping("/sales")
    public ResponseEntity<List<SalesOrderDto>> getSalesOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(orderService.getSalesOrders(status, search));
    }

    @GetMapping("/sales/{id}")
    public ResponseEntity<SalesOrderDto> getSalesOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getSalesOrderById(id));
    }

    @PostMapping("/sales")
    public ResponseEntity<SalesOrderDto> createSalesOrder(
            @RequestBody SalesOrderCreateRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(orderService.createSalesOrder(req, actor));
    }

    @PatchMapping("/sales/{id}/status")
    public ResponseEntity<SalesOrderDto> updateSalesOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(orderService.updateSalesOrderStatus(id, status, actor));
    }

    // Purchase Orders
    @GetMapping("/purchase")
    public ResponseEntity<List<PurchaseOrderDto>> getPurchaseOrders(
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(orderService.getPurchaseOrders(status, search));
    }

    @GetMapping("/purchase/{id}")
    public ResponseEntity<PurchaseOrderDto> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getPurchaseOrderById(id));
    }

    @PostMapping("/purchase")
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(
            @RequestBody PurchaseOrderCreateRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(orderService.createPurchaseOrder(req, actor));
    }

    @PostMapping("/purchase/receive")
    public ResponseEntity<PurchaseOrderDto> receiveGoods(
            @RequestBody ReceivePoRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(orderService.receiveGoods(req, actor));
    }
}
