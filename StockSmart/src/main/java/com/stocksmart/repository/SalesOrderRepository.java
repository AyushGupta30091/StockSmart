package com.stocksmart.repository;

import com.stocksmart.model.OrderStatus;
import com.stocksmart.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    long countByStatus(OrderStatus status);
    List<SalesOrder> findAllByOrderByCreatedAtDesc();
    List<SalesOrder> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    @Query("SELECT so FROM SalesOrder so WHERE " +
           "(:status IS NULL OR so.status = :status) AND " +
           "(:search IS NULL OR LOWER(so.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(so.customerName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<SalesOrder> searchOrders(@Param("status") OrderStatus status, @Param("search") String search);

    @Query("SELECT FUNCTION('TO_CHAR', so.orderDate, 'YYYY-MM-DD'), SUM(so.totalAmount) " +
           "FROM SalesOrder so WHERE so.status <> 'CANCELLED' " +
           "GROUP BY FUNCTION('TO_CHAR', so.orderDate, 'YYYY-MM-DD') " +
           "ORDER BY FUNCTION('TO_CHAR', so.orderDate, 'YYYY-MM-DD') ASC")
    List<Object[]> getDailySalesTrend();
}
