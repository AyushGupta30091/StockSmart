package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.AuthRequest;
import com.stocksmart.dto.AppDtos.AuthResponse;
import com.stocksmart.dto.AppDtos.UserDto;
import com.stocksmart.model.User;
import com.stocksmart.service.AuthService;
import com.stocksmart.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.getUserById(user.getId()));
    }
}
