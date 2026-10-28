package com.stocksmart;

import org.springframework.boot.SpringApplication;

public class TestStockSmartApplication {

	public static void main(String[] args) {
		SpringApplication.from(StockSmartApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
