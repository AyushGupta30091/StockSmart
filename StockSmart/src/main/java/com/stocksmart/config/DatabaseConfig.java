package com.stocksmart.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${ORACLE_URL:${DB_URL:}}")
    private String oracleUrl;

    @Value("${ORACLE_USER:${DB_USERNAME:}}")
    private String oracleUser;

    @Value("${ORACLE_PASSWORD:${DB_PASSWORD:}}")
    private String oraclePassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        if (StringUtils.hasText(oracleUrl) && StringUtils.hasText(oracleUser)) {
            log.info("Connecting to Oracle Database at: {}", oracleUrl);
            return DataSourceBuilder.create()
                    .driverClassName("oracle.jdbc.OracleDriver")
                    .url(oracleUrl)
                    .username(oracleUser)
                    .password(oraclePassword != null ? oraclePassword : "")
                    .build();
        } else {
            log.warn("=========================================================================");
            log.warn("ORACLE_URL / ORACLE_USER not set. Using Oracle-compatible in-memory mode.");
            log.warn("To connect to a live Oracle DB instance, set ORACLE_URL, ORACLE_USER, and ORACLE_PASSWORD.");
            log.warn("=========================================================================");
            return DataSourceBuilder.create()
                    .driverClassName("org.h2.Driver")
                    .url("jdbc:h2:mem:stocksmart;MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1;NON_KEYWORDS=KEY,VALUE")
                    .username("sa")
                    .password("")
                    .build();
        }
    }
}
