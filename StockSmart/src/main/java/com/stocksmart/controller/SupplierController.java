package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.SupplierDto;
import com.stocksmart.model.User;
import com.stocksmart.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<SupplierDto>> getSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierDto> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    public ResponseEntity<SupplierDto> createSupplier(
            @RequestBody SupplierDto dto,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(supplierService.createSupplier(dto, actor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierDto> updateSupplier(
            @PathVariable Long id,
            @RequestBody SupplierDto dto,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(supplierService.updateSupplier(id, dto, actor));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        supplierService.toggleActiveStatus(id, actor);
        return ResponseEntity.ok().build();
    }
}
