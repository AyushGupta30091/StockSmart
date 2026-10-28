package com.stocksmart.repository;

import com.stocksmart.model.PurchaseOrder;
import com.stocksmart.model.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:status IS NULL OR po.status = :status) AND " +
           "(:search IS NULL OR LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(po.supplier.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<PurchaseOrder> searchPurchaseOrders(@Param("status") PurchaseOrderStatus status, @Param("search") String search);
}
