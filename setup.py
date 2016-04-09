import re

from setuptools import setup, find_packages


version = ''
with open('bock/__init__.py', 'r') as f:
    version = re.search(
                    r'^__version__\s*=\s*[\'"]([^\'"]*)[\'"]',
                    f.read(),
                    re.MULTILINE
                ).group(1)

setup(
        name='bock',
        description=('A Flask and Markdown-based'
                     'personal wiki inspired by Gollum'),
        version=version,
        url='http://wiki.nikhil.io',
        author='Nikhil Anand',
        author_email='mail@nikhil.io',
        license='MIT',
        keywords='wiki markdown flask',
        packages=find_packages(),
        include_package_data=True,
        install_requires=[
            'arrow',
            'click',
            'flask',
            'gitpython',
            'glob2',
            'markdown',
            'pygments',
            'pymdown-extensions',
            'tornado',
            'watchdog',
            'whoosh',
        ],
        tests_require=[
            'pytest',
            'Flask-Testing',
            'gunicorn'
        ],
        entry_points={
            'console_scripts': [
                'bock=bock.cli:start',
            ],
        },
        classifiers=[
            'Development Status :: 4 - Beta',
            'Intended Audience :: Developers',
            'Topic :: Utilities',
            'License :: OSI Approved :: MIT License',
            'Programming Language :: Python :: 3',
            'Programming Language :: Python :: 3.5',
        ],
    )
