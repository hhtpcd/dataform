package(default_visibility = ["//tests:__subpackages__"])

load("//tools:node_modules.bzl", "node_modules")

filegroup(
    name = "files",
    srcs = glob([
        "**/*.*",
    ]),
)

node_modules(
    name = "node_modules",
    packages = [
        "@dataform/core@0.0.2-beta.1",
        "@dataform/protos@0.0.2-beta.1",
    ],
)
