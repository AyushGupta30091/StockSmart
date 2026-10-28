package com.stocksmart.repository;

import com.stocksmart.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByName(String name);
    Optional<Location> findByCode(String code);
    boolean existsByName(String name);
    boolean existsByCode(String code);
}
