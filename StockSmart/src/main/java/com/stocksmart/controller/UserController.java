package com.stocksmart.controller;

import com.stocksmart.dto.AppDtos.UserCreateRequest;
import com.stocksmart.dto.AppDtos.UserDto;
import com.stocksmart.dto.AppDtos.UserUpdateRequest;
import com.stocksmart.model.User;
import com.stocksmart.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@RequestBody UserCreateRequest req, @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "ADMIN";
        return ResponseEntity.ok(userService.createUser(req, actor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req, @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "ADMIN";
        return ResponseEntity.ok(userService.updateUser(id, req, actor));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleStatus(@PathVariable Long id, @AuthenticationPrincipal User user) {
        String actor = user != null ? user.getEmail() : "ADMIN";
        userService.toggleActiveStatus(id, actor);
        return ResponseEntity.ok().build();
    }
}
