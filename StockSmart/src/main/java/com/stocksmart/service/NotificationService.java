package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.NotificationDto;
import com.stocksmart.model.Notification;
import com.stocksmart.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public NotificationDto notify(String title, String message, String type, String targetRole) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .targetRole(targetRole)
                .readStatus(false)
                .createdAt(LocalDateTime.now())
                .build();
        notification = notificationRepository.save(notification);

        NotificationDto dto = mapToDto(notification);
        webSocketNotificationService.broadcastNotification(dto);
        return dto;
    }

    public List<NotificationDto> getNotificationsForUser(String role) {
        List<Notification> list;
        if (role != null && !role.equalsIgnoreCase("ADMIN")) {
            list = notificationRepository.findByTargetRoleOrTargetRoleIsNullOrderByCreatedAtDesc(role.toUpperCase());
        } else {
            list = notificationRepository.findTop50ByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void markAllRead() {
        List<Notification> list = notificationRepository.findAll();
        for (Notification n : list) {
            n.setReadStatus(true);
        }
        notificationRepository.saveAll(list);
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .targetRole(n.getTargetRole())
                .readStatus(n.getReadStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
