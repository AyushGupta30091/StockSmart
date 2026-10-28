package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastNotification(NotificationDto notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications", notification);
            if (notification.getTargetRole() != null) {
                messagingTemplate.convertAndSend("/topic/notifications/" + notification.getTargetRole().toLowerCase(), notification);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast notification via WebSocket: {}", e.getMessage());
        }
    }

    public void broadcastProductChange(String action, Object product) {
        try {
            messagingTemplate.convertAndSend("/topic/products", new ProductChangeEvent(action, product));
        } catch (Exception e) {
            log.error("Failed to broadcast product change via WebSocket: {}", e.getMessage());
        }
    }

    public void broadcastStockChange(Object stockInfo) {
        try {
            messagingTemplate.convertAndSend("/topic/inventory", stockInfo);
        } catch (Exception e) {
            log.error("Failed to broadcast stock change via WebSocket: {}", e.getMessage());
        }
    }

    public record ProductChangeEvent(String action, Object data) {}
}
