package com.stocksmart.controller;

import com.stocksmart.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getReportData() {
        return ResponseEntity.ok(reportService.getReportsData());
    }
}
