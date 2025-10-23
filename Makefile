VENV = .VENV

run: dependencies
	$(VENV)/bin/python3 main.py

dependencies:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip3 install -q -r requirements.txt