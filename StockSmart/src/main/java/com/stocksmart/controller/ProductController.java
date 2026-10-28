package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.ProductCreateRequest;
import com.stocksmart.dto.AppDtos.ProductDto;
import com.stocksmart.model.User;
import com.stocksmart.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productService.getProducts(categoryId, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ProductDto> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(productService.getProductBySku(sku));
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @RequestBody ProductCreateRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        String role = user != null && user.getRole() != null ? user.getRole().name() : "STAFF";
        return ResponseEntity.ok(productService.createProduct(req, actor, role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductCreateRequest req,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(productService.updateProduct(id, req, actor));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        productService.deleteProduct(id, actor);
        return ResponseEntity.ok().build();
    }
}
