import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.module_loading import import_string

logger = logging.getLogger(__name__)

@csrf_exempt
def custom_ckeditor_upload(request):
    """
    Vue qui gère l'upload d'images depuis CKEditor 5.
    """
    if request.method == "POST":
        if 'upload' not in request.FILES:
            return JsonResponse({'error': {'message': 'No file was uploaded.'}}, status=400)

        uploaded_file = request.FILES['upload']
        
        try:
            storage_class_path = settings.CKEDITOR_5_FILE_STORAGE
            StorageClass = import_string(storage_class_path)
            storage = StorageClass()
            
            saved_file_name = storage.save(uploaded_file.name, uploaded_file)
            file_url = storage.url(saved_file_name)

            logger.info(f"CKEditor uploaded '{uploaded_file.name}' saved as '{saved_file_name}'")
            return JsonResponse({'url': file_url})

        except Exception as e:
            logger.error(f"Error in custom_ckeditor_upload: {e}", exc_info=True)
            return JsonResponse({'error': {'message': 'Server error during upload.'}}, status=500)

    return JsonResponse({'error': {'message': 'Method not allowed.'}}, status=405)