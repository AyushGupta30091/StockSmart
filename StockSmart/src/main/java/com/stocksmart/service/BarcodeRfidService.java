package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.BarcodeLookupResponse;
import com.stocksmart.dto.AppDtos.InventoryDto;
import com.stocksmart.dto.AppDtos.ProductDto;
import com.stocksmart.dto.AppDtos.RfidTagDto;
import com.stocksmart.model.Product;
import com.stocksmart.model.RFIDTag;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.RFIDTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BarcodeRfidService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final RFIDTagRepository rfidTagRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;

    public BarcodeLookupResponse lookupBarcodeOrSku(String code) {
        if (code == null || code.trim().isEmpty()) {
            return BarcodeLookupResponse.builder().found(false).build();
        }

        String search = code.trim();
        Optional<Product> productOpt = productRepository.findByBarcode(search);
        if (productOpt.isEmpty()) {
            productOpt = productRepository.findBySku(search);
        }

        if (productOpt.isEmpty()) {
            return BarcodeLookupResponse.builder().found(false).build();
        }

        Product p = productOpt.get();
        ProductDto pDto = productService.mapToDto(p);
        List<InventoryDto> locStocks = inventoryService.getInventory(p.getId(), null);
        Integer total = inventoryRepository.getTotalStockByProductId(p.getId());
        if (total == null) total = 0;

        return BarcodeLookupResponse.builder()
                .found(true)
                .product(pDto)
                .locationStocks(locStocks)
                .totalStock(total)
                .overallStatus(pDto.getStatus())
                .build();
    }

    @Transactional
    public RfidTagDto scanRfidTag(String tagId, String currentActor) {
        if (tagId == null || tagId.trim().isEmpty()) {
            throw new IllegalArgumentException("RFID Tag ID cannot be empty.");
        }

        RFIDTag tag = rfidTagRepository.findByTagId(tagId.trim())
                .orElseThrow(() -> new IllegalArgumentException("RFID Tag not found: " + tagId));

        tag.setLastScannedAt(LocalDateTime.now());
        tag.setStatus("SCANNED");
        tag = rfidTagRepository.save(tag);

        auditLogService.record(currentActor, "RFID_SCANNED", "RFID_TAG", tag.getTagId(),
                "RFID Tag " + tag.getTagId() + " scanned for product " + tag.getProduct().getName() + " (Simulation)");

        return mapRfidToDto(tag);
    }

    public List<RfidTagDto> getAllRfidTags() {
        return rfidTagRepository.findAllByOrderByLastScannedAtDesc().stream()
                .map(this::mapRfidToDto)
                .collect(Collectors.toList());
    }

    public RfidTagDto mapRfidToDto(RFIDTag t) {
        return RfidTagDto.builder()
                .id(t.getId())
                .tagId(t.getTagId())
                .productId(t.getProduct().getId())
                .productName(t.getProduct().getName())
                .sku(t.getProduct().getSku())
                .locationId(t.getLocation() != null ? t.getLocation().getId() : null)
                .locationName(t.getLocation() != null ? t.getLocation().getName() : "Unassigned")
                .status(t.getStatus())
                .lastScannedAt(t.getLastScannedAt())
                .build();
    }
}
