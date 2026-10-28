package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.UserCreateRequest;
import com.stocksmart.dto.AppDtos.UserDto;
import com.stocksmart.dto.AppDtos.UserUpdateRequest;
import com.stocksmart.model.Location;
import com.stocksmart.model.User;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Transactional
    public UserDto createUser(UserCreateRequest req, String currentActor) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("User with email " + req.getEmail() + " already exists");
        }

        Location location = null;
        if (req.getLocationId() != null) {
            location = locationRepository.findById(req.getLocationId()).orElse(null);
        }

        User user = User.builder()
                .email(req.getEmail().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName().trim())
                .role(req.getRole())
                .location(location)
                .active(true)
                .build();

        user = userRepository.save(user);

        auditLogService.record(currentActor, "USER_CREATED", "USER", String.valueOf(user.getId()),
                "Created user: " + user.getEmail() + " with role " + user.getRole());

        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateRequest req, String currentActor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getRole() != null) {
            user.setRole(req.getRole());
        }
        if (req.getActive() != null) {
            user.setActive(req.getActive());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getLocationId() != null) {
            Location location = locationRepository.findById(req.getLocationId()).orElse(null);
            user.setLocation(location);
        }

        user = userRepository.save(user);

        auditLogService.record(currentActor, "USER_UPDATED", "USER", String.valueOf(user.getId()),
                "Updated user: " + user.getEmail());

        return mapToDto(user);
    }

    @Transactional
    public void toggleActiveStatus(Long id, String currentActor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setActive(!Boolean.TRUE.equals(user.getActive()));
        userRepository.save(user);

        auditLogService.record(currentActor, "USER_STATUS_TOGGLED", "USER", String.valueOf(user.getId()),
                "User " + user.getEmail() + " active status set to: " + user.getActive());
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .locationId(user.getLocation() != null ? user.getLocation().getId() : null)
                .locationName(user.getLocation() != null ? user.getLocation().getName() : null)
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
