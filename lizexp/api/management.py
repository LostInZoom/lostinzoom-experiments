def questionPrompt(prompt):
    i = 0
    while i < 2:
        answer = input(prompt)
        if any(answer.lower() == f for f in ["yes", 'y']):
            return True
        elif any(answer.lower() == f for f in ['no', 'n']):
            return False
        else:
            i += 1
            if i < 2:
                print('Please enter yes or no')
            else:
                return False

def eraseWarning(app):
    prompt = "WARNING: This operation will completely clear " + app + " database.\nYou won't be able to retrieve any data afterwards.\nProceed? (yes or no)\n"
    state = questionPrompt(prompt)
    return state