package com.stocksmart.service;

import com.stocksmart.dto.AppDtos.CategoryDto;
import com.stocksmart.model.Category;
import com.stocksmart.repository.CategoryRepository;
import com.stocksmart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(CategoryDto dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Category with name " + dto.getName() + " already exists");
        }
        Category cat = Category.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .active(true)
                .build();
        cat = categoryRepository.save(cat);
        return mapToDto(cat);
    }

    public CategoryDto mapToDto(Category cat) {
        return CategoryDto.builder()
                .id(cat.getId())
                .name(cat.getName())
                .description(cat.getDescription())
                .active(cat.getActive())
                .productCount(0)
                .build();
    }
}
