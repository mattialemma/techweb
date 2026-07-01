""" Classe di paginazione condivisa tra le API """

from rest_framework.pagination import PageNumberPagination


class DefaultPageNumberPagination(PageNumberPagination):
    page_size_query_param = "pageSize"
    page_size = 25
    max_page_size = 110
