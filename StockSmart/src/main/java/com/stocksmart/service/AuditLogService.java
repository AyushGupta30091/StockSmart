package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.AuditLogDto;
import com.stocksmart.model.AuditLog;
import com.stocksmart.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void record(String actor, String action, String entityType, String entityId, String description) {
        AuditLog log = AuditLog.builder()
                .actor(actor != null ? actor : "SYSTEM")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc().stream()
                .map(log -> AuditLogDto.builder()
                        .id(log.getId())
                        .actor(log.getActor())
                        .action(log.getAction())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .description(log.getDescription())
                        .timestamp(log.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
}
