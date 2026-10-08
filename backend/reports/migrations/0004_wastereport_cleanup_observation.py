from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0003_resync_image_urls'),
    ]

    operations = [
        migrations.AddField(
            model_name='wastereport',
            name='cleanup_observation',
            field=models.TextField(blank=True, default=''),
        ),
    ]
