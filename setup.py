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
        'argh==0.26.2',
        'arrow==0.10.0',
        'bumpversion==0.5.3',
        'click==6.6',
        'Flask==0.11.1',
        'gitdb2==2.0.0',
        'GitPython==2.1.1',
        'glob2==0.5',
        'gunicorn==19.6.0',
        'itsdangerous==0.24',
        'Jinja2==2.8',
        'Markdown==2.6.7',
        'MarkupSafe==0.23',
        'pathtools==0.1.2',
        'Pygments==2.1.3',
        'pymdown-extensions==1.2',
        'python-dateutil==2.6.0',
        'PyYAML==3.12',
        'six==1.10.0',
        'smmap2==2.0.1',
        'tornado==4.4.2',
        'watchdog==0.8.3',
        'Werkzeug==0.11.11',
        'Whoosh==2.7.4',
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
