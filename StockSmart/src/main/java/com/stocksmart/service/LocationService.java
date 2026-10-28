package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.LocationDto;
import com.stocksmart.model.Location;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;

    public List<LocationDto> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LocationDto getLocationById(Long id) {
        Location loc = locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found with id: " + id));
        return mapToDto(loc);
    }

    @Transactional
    public LocationDto createLocation(LocationDto dto) {
        if (locationRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Location with name " + dto.getName() + " already exists");
        }
        Location loc = Location.builder()
                .name(dto.getName().trim())
                .code(dto.getCode() != null ? dto.getCode().trim().toUpperCase() : dto.getName().substring(0, 3).toUpperCase())
                .address(dto.getAddress())
                .type(dto.getType() != null ? dto.getType() : "STORE")
                .active(true)
                .build();
        loc = locationRepository.save(loc);
        return mapToDto(loc);
    }

    public LocationDto mapToDto(Location loc) {
        Integer stock = inventoryRepository.findByLocationId(loc.getId()).stream()
                .mapToInt(i -> i.getAvailableStock() != null ? i.getAvailableStock() : 0)
                .sum();

        return LocationDto.builder()
                .id(loc.getId())
                .name(loc.getName())
                .code(loc.getCode())
                .address(loc.getAddress())
                .type(loc.getType())
                .active(loc.getActive())
                .totalStock(stock)
                .build();
    }
}
