# User Guide

The chat controller can tailor answers using domain-specific expertise profiles. Profiles live in `config/expertise/` and describe key statutes, common terminology, and typical reasoning patterns for each area of law.

## Selecting a profile

Choose a domain explicitly when configuring the controller:

```python
from chat.controller import ChatController

controller = ChatController()
controller.configure(domain="criminal")
print(controller.get_profile()["statutes"])
```

## Automatic detection

If no domain is provided, the controller inspects the prompt and loads the matching profile when keywords are found:

```python
controller.configure(text="What is the punishment for theft under IPC?")
print(controller.domain)  # -> 'criminal'
```

Call `configure` again with a different domain or text to switch profiles at any time.
