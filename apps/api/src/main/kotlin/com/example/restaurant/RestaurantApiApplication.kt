package com.example.restaurant

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class RestaurantApiApplication

fun main(args: Array<String>) {
    runApplication<RestaurantApiApplication>(*args)
}
