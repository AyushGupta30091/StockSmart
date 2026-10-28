package com.stocksmart.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "APP_NOTIFICATION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 30)
    @Builder.Default
    private String type = "INFO"; // INFO, SUCCESS, WARNING, DANGER

    @Column(length = 30)
    private String targetRole; // null for all, or ADMIN, MANAGER, etc.

    @Column(nullable = false)
    @Builder.Default
    private Boolean readStatus = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
