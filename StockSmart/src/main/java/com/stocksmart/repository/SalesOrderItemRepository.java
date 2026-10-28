package com.stocksmart.repository;

import com.stocksmart.model.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {
    List<SalesOrderItem> findBySalesOrderId(Long salesOrderId);

    @Query("SELECT soi.product.name, SUM(soi.quantity) as totalQty " +
           "FROM SalesOrderItem soi " +
           "WHERE soi.salesOrder.status <> 'CANCELLED' " +
           "GROUP BY soi.product.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> getTopSellingProducts();
}
