package com.stocksmart.repository;

import com.stocksmart.model.Inventory;
import com.stocksmart.model.Location;
import com.stocksmart.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductAndLocation(Product product, Location location);

    Optional<Inventory> findByProductIdAndLocationId(Long productId, Long locationId);

    List<Inventory> findByProductId(Long productId);

    List<Inventory> findByLocationId(Long locationId);

    @Query("SELECT COALESCE(SUM(i.availableStock), 0) FROM Inventory i WHERE i.product.id = :productId")
    Integer getTotalStockByProductId(@Param("productId") Long productId);

    @Query("SELECT i FROM Inventory i WHERE i.availableStock <= i.reorderLevel")
    List<Inventory> findLowStockInventories();

    @Query("SELECT i.location.name, COALESCE(SUM(i.availableStock), 0) FROM Inventory i GROUP BY i.location.name")
    List<Object[]> getStockByLocationGroup();

    @Query("SELECT COALESCE(SUM(i.availableStock * i.product.sellingPrice), 0) FROM Inventory i")
    BigDecimal getTotalStockValuation();
}
