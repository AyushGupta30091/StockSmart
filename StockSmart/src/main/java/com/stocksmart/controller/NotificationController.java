package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.NotificationDto;
import com.stocksmart.model.User;
import com.stocksmart.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(@AuthenticationPrincipal User user) {
        String role = user != null && user.getRole() != null ? user.getRole().name() : null;
        return ResponseEntity.ok(notificationService.getNotificationsForUser(role));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Void> markRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok().build();
    }
}
