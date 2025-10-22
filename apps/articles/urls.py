from django.urls import path
from . import views

app_name = 'articles'



urlpatterns = [
    path('articles/', views.ArticleListView.as_view(), name='article_list'),
    path('articles/category/<slug:category_slug>/', views.ArticleListView.as_view(), name='article_list_by_category'),
    path('article/<slug:slug>/', views.ArticleDetailView.as_view(), name='article_detail'),
    path('filter-articles/', views.filter_articles_ajax, name='filter_articles_ajax'),
]