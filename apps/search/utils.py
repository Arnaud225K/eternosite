def convert_qwerty_to_cyrillic(text):
    """
    Traduit une chaîne de caractères de la disposition QWERTY anglaise
    vers la disposition ЙЦУКЕН cyrillique.
    """
    if not text:
        return text

    # Dictionnaire de correspondance des caractères
    layout_map = {
        'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 
        'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы', 
        'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', 
        ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 
        'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю', '`': 'ё',
        'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Г', 
        'I': 'Ш', 'O': 'Щ', 'P': 'З', '{': 'Х', '}': 'Ъ', 'A': 'Ф', 'S': 'Ы', 
        'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л', 'L': 'Д', 
        ':': 'Ж', '"': 'Э', 'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И', 
        'N': 'Т', 'M': 'Ь', '<': 'Б', '>': 'Ю', '~': 'Ё',
    }
    
    # On ne traduit que si le texte semble être majoritairement en QWERTY
    # (pour éviter de traduire des mots comme "iPhone" en "шЗрщту")
    latin_chars = "qwertyuiop[]asdfghjkl;'zxcvbnm,."
    cyrillic_count = sum(1 for char in text if 'а' <= char.lower() <= 'я')
    
    # Si plus de 30% des caractères sont déjà en cyrillique, on ne traduit pas.
    if cyrillic_count / len(text) > 0.3:
        return text

    # On vérifie si au moins un caractère QWERTY est présent
    if not any(c in latin_chars for c in text.lower()):
        return text

    # Traduction caractère par caractère
    return "".join(layout_map.get(char, char) for char in text)