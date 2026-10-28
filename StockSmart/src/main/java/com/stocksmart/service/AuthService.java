package com.stocksmart.service;

import com.stocksmart.config.JwtUtils;
import com.stocksmart.dto.AppDtos.AuthRequest;
import com.stocksmart.dto.AppDtos.AuthResponse;
import com.stocksmart.model.User;
import com.stocksmart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;

    public AuthResponse login(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new BadCredentialsException("Email and password are required");
        }

        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            auditLogService.record(request.getEmail(), "LOGIN_FAILED", "USER", null, "Failed login attempt: incorrect password");
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BadCredentialsException("Account has been deactivated. Please contact administrator.");
        }

        String token = jwtUtils.generateToken(user);

        auditLogService.record(user.getEmail(), "LOGIN_SUCCESS", "USER", String.valueOf(user.getId()), "User successfully logged in");

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .locationId(user.getLocation() != null ? user.getLocation().getId() : null)
                .locationName(user.getLocation() != null ? user.getLocation().getName() : null)
                .build();
    }
}
