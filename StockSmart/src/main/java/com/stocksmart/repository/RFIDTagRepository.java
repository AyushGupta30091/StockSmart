package com.stocksmart.repository;

import com.stocksmart.model.RFIDTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RFIDTagRepository extends JpaRepository<RFIDTag, Long> {
    Optional<RFIDTag> findByTagId(String tagId);
    boolean existsByTagId(String tagId);
    List<RFIDTag> findByProductId(Long productId);
    List<RFIDTag> findAllByOrderByLastScannedAtDesc();
}
