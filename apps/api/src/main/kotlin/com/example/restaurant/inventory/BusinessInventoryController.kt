package com.example.restaurant.inventory

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business")
class BusinessInventoryController(
    private val inventoryService: InventoryService,
) {
    @GetMapping("/tables")
    fun listTables(servletRequest: HttpServletRequest): List<RestaurantTableResponse> =
        inventoryService.listTables(BusinessAuthContext.principal(servletRequest))

    @PostMapping("/tables")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTable(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: RestaurantTableSaveRequest,
    ): RestaurantTableResponse =
        inventoryService.createTable(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
        )

    @PutMapping("/tables/{tableId}")
    fun updateTable(
        servletRequest: HttpServletRequest,
        @PathVariable tableId: Long,
        @Valid @RequestBody request: RestaurantTableSaveRequest,
    ): RestaurantTableResponse =
        inventoryService.updateTable(
            principal = BusinessAuthContext.principal(servletRequest),
            tableId = tableId,
            request = request,
        )

    @GetMapping("/table-combinations")
    fun listCombinations(servletRequest: HttpServletRequest): List<TableCombinationResponse> =
        inventoryService.listCombinations(BusinessAuthContext.principal(servletRequest))

    @PostMapping("/table-combinations")
    @ResponseStatus(HttpStatus.CREATED)
    fun createCombination(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: TableCombinationSaveRequest,
    ): TableCombinationResponse =
        inventoryService.createCombination(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
        )

    @PutMapping("/table-combinations/{combinationId}")
    fun updateCombination(
        servletRequest: HttpServletRequest,
        @PathVariable combinationId: Long,
        @Valid @RequestBody request: TableCombinationSaveRequest,
    ): TableCombinationResponse =
        inventoryService.updateCombination(
            principal = BusinessAuthContext.principal(servletRequest),
            combinationId = combinationId,
            request = request,
        )

    @GetMapping("/reservation-products/{productId}/seat-rules")
    fun seatRules(
        servletRequest: HttpServletRequest,
        @PathVariable productId: Long,
    ): ReservationProductSeatRuleResponse =
        inventoryService.seatRules(
            principal = BusinessAuthContext.principal(servletRequest),
            productId = productId,
        )

    @PostMapping("/reservation-products/{productId}/seat-rules")
    fun saveSeatRules(
        servletRequest: HttpServletRequest,
        @PathVariable productId: Long,
        @Valid @RequestBody request: ReservationProductSeatRuleSaveRequest,
    ): ReservationProductSeatRuleResponse =
        inventoryService.saveSeatRules(
            principal = BusinessAuthContext.principal(servletRequest),
            productId = productId,
            request = request,
        )
}
