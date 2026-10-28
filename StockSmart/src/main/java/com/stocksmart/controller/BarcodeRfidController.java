package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.BarcodeLookupResponse;
import com.stocksmart.dto.AppDtos.RfidTagDto;
import com.stocksmart.model.User;
import com.stocksmart.service.BarcodeRfidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barcode-rfid")
@RequiredArgsConstructor
public class BarcodeRfidController {

    private final BarcodeRfidService barcodeRfidService;

    @GetMapping("/lookup")
    public ResponseEntity<BarcodeLookupResponse> lookup(@RequestParam String code) {
        return ResponseEntity.ok(barcodeRfidService.lookupBarcodeOrSku(code));
    }

    @GetMapping("/tags")
    public ResponseEntity<List<RfidTagDto>> getAllTags() {
        return ResponseEntity.ok(barcodeRfidService.getAllRfidTags());
    }

    @PostMapping("/scan-rfid")
    public ResponseEntity<RfidTagDto> scanRfid(
            @RequestParam String tagId,
            @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "USER";
        return ResponseEntity.ok(barcodeRfidService.scanRfidTag(tagId, actor));
    }
}
