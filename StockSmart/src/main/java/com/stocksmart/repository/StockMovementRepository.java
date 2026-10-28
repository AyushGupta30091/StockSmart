package com.stocksmart.repository;

import com.stocksmart.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findTop50ByOrderByCreatedAtDesc();
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<StockMovement> findByLocationIdOrderByCreatedAtDesc(Long locationId);
}
