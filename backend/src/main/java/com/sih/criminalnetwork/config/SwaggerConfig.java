package com.sih.criminalnetwork.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SwaggerConfig — configures OpenAPI 3.0 documentation.
 *
 * Swagger UI:  http://localhost:8080/swagger-ui.html
 * API JSON:    http://localhost:8080/v3/api-docs
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI crimeNetOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CrimeNet API — SIH26189")
                        .description("""
                            **Criminal Network Analysis Platform**
                            
                            AI-powered REST API for extracting and analysing criminal networks
                            from police documents (FIRs, call records, financial statements).
                            
                            ### Key Endpoints
                            - `POST /api/v1/analyse` — Upload a document and extract entities + relationships
                            - `GET  /api/v1/graph`   — Full D3-ready network graph
                            - `GET  /api/v1/stats`   — Dashboard statistics
                            - `GET  /api/v1/entities` — List/filter entities
                            """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("SIH26189 Team")
                                .email("team@crimenet.gov.in"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development"),
                        new Server()
                                .url("https://api.crimenet.gov.in")
                                .description("Production")
                ));
    }
}
