package com.sih.criminalnetwork;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CriminalNetworkApplication — Spring Boot entry point for SIH26189.
 * API base: http://localhost:8080/api/v1
 */
@SpringBootApplication
public class CriminalNetworkApplication {

    private static final Logger log = LoggerFactory.getLogger(CriminalNetworkApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(CriminalNetworkApplication.class, args);
        log.info("=================================================");
        log.info("  CrimeNet Backend — SIH26189 started");
        log.info("  API:        http://localhost:8080/api/v1");
        log.info("  H2 Console: http://localhost:8080/h2-console");
        log.info("=================================================");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
