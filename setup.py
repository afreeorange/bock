import re

from setuptools import setup, find_packages


version = ''
with open('bock/__init__.py', 'r') as f:
    version = re.search(
        r'^__version__\s*=\s*[\'"]([^\'"]*)[\'"]',
        f.read(),
        re.MULTILINE,
    ).group(1)

setup(
    name='bock',
    description=('A Flask and Markdown-based '
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
        'arrow==0.7.0',
        'click==6.3',
        'Flask==0.10.1',
        'GitPython==1.0.2',
        'glob2==0.4.1',
        'Markdown==2.6.5',
        'Pygments==2.1.3',
        'pymdown-extensions==1.1',
        'tornado==4.3',
        'watchdog==0.8.3',
        'Whoosh==2.7.2',
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
