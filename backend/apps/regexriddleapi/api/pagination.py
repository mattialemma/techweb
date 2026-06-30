"""Shared DRF pagination classes for public API collections.

Exports a conservative page-number paginator used by APIView-based endpoints.
"""

from rest_framework.pagination import PageNumberPagination


class DefaultPageNumberPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "pageSize"
    max_page_size = 100
