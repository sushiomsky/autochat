SHELL := /bin/bash
NPM_FLAGS ?= --legacy-peer-deps

.PHONY: setup install lint test format-check build verify audit ci clean docker-build

setup: install

install:
	CHROMEDRIVER_SKIP_DOWNLOAD=1 PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 npm ci $(NPM_FLAGS)

lint:
	npm run lint:ci

test:
	npm run test:ci

format-check:
	npm run format:check

build:
	npm run build:prod

verify:
	npm run verify

audit:
	npm run audit:ci

ci: lint format-check test build audit

clean:
	npm run clean

docker-build:
	docker build -t autochat:dev .
