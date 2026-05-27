package com.example.restaurant.member

data class PublicMemberListResponse(
    val members: List<PublicMemberResponse>,
)

data class PublicMemberResponse(
    val id: Long,
    val name: String,
    val phoneLast4: String,
    val email: String,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val marketingOptIn: Boolean,
)
