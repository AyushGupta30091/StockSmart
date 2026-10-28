package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.SupplierDto;
import com.stocksmart.model.Supplier;
import com.stocksmart.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditLogService auditLogService;

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SupplierDto getSupplierById(Long id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with id: " + id));
        return mapToDto(s);
    }

    @Transactional
    public SupplierDto createSupplier(SupplierDto dto, String actor) {
        Supplier s = Supplier.builder()
                .name(dto.getName())
                .contactPerson(dto.getContactPerson())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .productsSupplied(dto.getProductsSupplied())
                .active(true)
                .build();
        s = supplierRepository.save(s);
        auditLogService.record(actor, "SUPPLIER_CREATED", "SUPPLIER", String.valueOf(s.getId()), "Created supplier: " + s.getName());
        return mapToDto(s);
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, SupplierDto dto, String actor) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with id: " + id));
        s.setName(dto.getName());
        s.setContactPerson(dto.getContactPerson());
        s.setEmail(dto.getEmail());
        s.setPhone(dto.getPhone());
        s.setAddress(dto.getAddress());
        s.setProductsSupplied(dto.getProductsSupplied());
        if (dto.getActive() != null) {
            s.setActive(dto.getActive());
        }
        s = supplierRepository.save(s);
        auditLogService.record(actor, "SUPPLIER_UPDATED", "SUPPLIER", String.valueOf(s.getId()), "Updated supplier: " + s.getName());
        return mapToDto(s);
    }

    @Transactional
    public void toggleActiveStatus(Long id, String actor) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with id: " + id));
        s.setActive(!Boolean.TRUE.equals(s.getActive()));
        supplierRepository.save(s);
        auditLogService.record(actor, "SUPPLIER_STATUS_TOGGLED", "SUPPLIER", String.valueOf(s.getId()),
                "Supplier " + s.getName() + " active status set to: " + s.getActive());
    }

    public SupplierDto mapToDto(Supplier s) {
        return SupplierDto.builder()
                .id(s.getId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .email(s.getEmail())
                .phone(s.getPhone())
                .address(s.getAddress())
                .productsSupplied(s.getProductsSupplied())
                .active(s.getActive())
                .build();
    }
}
