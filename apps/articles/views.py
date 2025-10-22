from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Articles, ArticleCategory
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger, Page
from django.template.loader import render_to_string
from django.http import JsonResponse


SIZE_ARTICLES = 6


class ArticleListView(ListView):
    model = Articles
    template_name = 'articles/articles.html'
    context_object_name = 'articles'
    paginate_by = SIZE_ARTICLES

    def get_queryset(self):
        qs = Articles.objects.filter(is_hidden=False).select_related('category')
        category_slug = self.kwargs.get('category_slug')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs.order_by('order_number', '-date')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ArticleCategory.objects.all()
        context['articles'] = context.get('page_obj') 
        context['active_category_slug'] = self.kwargs.get('category_slug')
        context['is_articles_page'] = True
        return context



class ArticleDetailView(DetailView):
    """ Affiche la page de détail d'un article spécifique. """
    model = Articles
    template_name = 'articles/p-articles.html'
    context_object_name = 'article'

    def get_queryset(self):
        return super().get_queryset().filter(is_hidden=False)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
    



def filter_articles_ajax(request):
    category_slug = request.GET.get('category_slug', None)
    
    qs = Articles.objects.filter(is_hidden=False).select_related('category')
    if category_slug:
        qs = qs.filter(category__slug=category_slug)
    
    page_number = request.GET.get('page', 1)
    paginator = Paginator(qs, SIZE_ARTICLES)
    page_obj = paginator.get_page(page_number)

    context = {
        'articles': page_obj
    }
    
    html_articles = render_to_string('includes/partials/_articles_cards.html', context)
    html_pagination = render_to_string('includes/partials/_articles_pagination.html', context)

    return JsonResponse({
        'html_articles': html_articles,
        'html_pagination': html_pagination,
    })